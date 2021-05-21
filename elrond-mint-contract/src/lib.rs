#![no_std]

mod action;
mod user_role;

use action::{Action, PerformActionResult};
use user_role::UserRole;

elrond_wasm::imports!();

const XPTOKEN_IDENT: &[u8] = b"XPNT-sdsd";

#[elrond_wasm_derive::contract]
pub trait Multisig {
	#[storage_mapper("user")]
	fn user_mapper(&self) -> UserMapper<Self::Storage>;

	#[view(getMinValid)]
	#[storage_mapper("min_valid")]
	fn min_valid(&self) -> SingleValueMapper<Self::Storage, usize>;

	#[view(getUserRole)]
	#[storage_get("user_role")]
	fn get_user_id_to_role(&self, user_id: usize) -> UserRole;

	#[storage_set("user_role")]
	fn set_user_id_to_role(&self, user_id: usize, user_role: UserRole);

	#[view(getNumValdators)]
	#[storage_mapper("num_validators")]
	fn num_validators(&self) -> SingleValueMapper<Self::Storage, usize>;


	#[storage_mapper("action_data")]
	fn action_mapper(&self) -> VecMapper<Self::Storage, Action<Self::BigUint>>;

	/// The index of the last proposed action.
	/// 0 means that no action was ever proposed yet.
	#[view(getActionLastIndex)]
	fn get_action_last_index(&self) -> usize {
		self.action_mapper().len()
	}

	/// Serialized action data of an action with index.
	#[view(getActionData)]
	fn get_action_data(&self, action_id: usize) -> Action<Self::BigUint> {
		self.action_mapper().get(action_id)
	}

	#[storage_mapper("action_signer_ids")]
	fn action_signer_ids(&self, action_id: usize) -> SingleValueMapper<Self::Storage, Vec<usize>>;

	fn clear_action(&self, action_id: usize) {
		self.action_mapper().clear_entry_unchecked(action_id);
		self.action_signer_ids(action_id).clear();
	}

	#[init]
	fn init(&self, min_valid: usize, #[var_args] validators: VarArgs<Address>) -> SCResult<()> {
		require!(
			!validators.is_empty(),
			"validators cannot be empty on init, no-one would be able to propose"
		);
		require!(validators.len() <= validators.len(), "quorum cannot exceed board size");
		self.min_valid().set(&min_valid);

		let mut duplicates = false;
		self.user_mapper()
			.get_or_create_users(validators.as_slice(), |user_id, new_user| {
				if !new_user {
					duplicates = true;
				}
				self.set_user_id_to_role(user_id, UserRole::Validator);
			});
		require!(!duplicates, "duplicate board member");
		self.num_validators().set(&validators.len());

		Ok(())
	}

	#[payable("EGLD")]
	#[endpoint]
	fn deposit(&self) {}

	#[view]
	fn signed(&self, user: Address, action_id: usize) -> bool {
		let user_id = self.user_mapper().get_user_id(&user);
		if user_id == 0 {
			false
		} else {
			let signer_ids = self.action_signer_ids(action_id).get();
			signer_ids.contains(&user_id)
		}
	}

	#[view(userRole)]
	fn user_role(&self, user: Address) -> UserRole {
		let user_id = self.user_mapper().get_user_id(&user);
		if user_id == 0 {
			UserRole::None
		} else {
			self.get_user_id_to_role(user_id)
		}
	}

	fn validate_action(&self, action: Action<Self::BigUint>) -> SCResult<usize> {
		let caller_address = self.blockchain().get_caller();
		let caller_id = self.user_mapper().get_user_id(&caller_address);
		let caller_role = self.get_user_id_to_role(caller_id);
		require!(
			caller_role.can_sign(),
			"only board members and proposers can propose"
		);

		let mut action_mapper = self.action_mapper();
		let action_id = action_mapper.push(&action);

		let mut ret = true;
		self.action_signer_ids(action_id).update(|signer_ids| {
			if !signer_ids.contains(&caller_id) {
				signer_ids.push(caller_id);
				ret = false;
			}
		});
		if ret {
			return Ok(action_id);
		}

		let min_valid = self.min_valid().get();
		let valid_signers_count = self.get_action_valid_signer_count(action_id);

		if valid_signers_count == min_valid {
			let res = self.perform_action(action);
			return if let Ok(_) = res {
				Ok(action_id)
			} else {
				Err(res.err().unwrap())
			};
		} else if valid_signers_count > min_valid && valid_signers_count == self.num_validators().get() {
			// clean up storage
			self.clear_action(action_id);
		}
	
		Ok(action_id)
	}

	/// Initiates board member addition process.
	/// Can also be used to promote a proposer to board member.
	#[endpoint(proposeAddValidator)]
	fn propose_add_validator(&self, board_member_address: Address) -> SCResult<usize> {
		self.validate_action(Action::AddValidator(board_member_address))
	}

	/// Removes user regardless of whether it is a board member or proposer.
	#[endpoint(proposeRemoveUser)]
	fn propose_remove_user(&self, user_address: Address) -> SCResult<usize> {
		self.validate_action(Action::RemoveUser(user_address))
	}

	#[endpoint(proposeChangeMinValid)]
	fn propose_change_min_valid(&self, new_quorum: usize) -> SCResult<usize> {
		self.validate_action(Action::ChangeMinValid(new_quorum))
	}

	#[endpoint(validateSendXp)]
	fn validate_send_xp(
		&self,
		to: Address,
		amount: Self::BigUint,
		#[var_args] opt_data: OptionalArg<BoxedBytes>,
	) -> SCResult<usize> {
		let data = match opt_data {
			OptionalArg::Some(data) => data,
			OptionalArg::None => BoxedBytes::empty(),
		};
		self.validate_action(Action::SendXP { to, amount, data })
	}

		/// Can be used to:
	/// - create new user (board member / proposer)
	/// - remove user (board member / proposer)
	/// - reactivate removed user
	/// - convert between board member and proposer
	/// Will keep the board size and proposer count in sync.
	fn change_user_role(&self, user_address: Address, new_role: UserRole) {
		let user_id = self.user_mapper().get_or_create_user(&user_address);
		let old_role = if user_id == 0 {
			UserRole::None
		} else {
			self.get_user_id_to_role(user_id)
		};
		self.set_user_id_to_role(user_id, new_role);

		// update board size
		#[allow(clippy::collapsible_if)]
		if old_role == UserRole::Validator {
			if new_role != UserRole::Validator {
				self.num_validators().update(|val| *val -= 1);
			}
		} else {
			if new_role == UserRole::Validator {
				self.num_validators().update(|val| *val += 1);
			}
		}
	}

	#[view(getActionSigners)]
	fn get_action_signers(&self, action_id: usize) -> Vec<Address> {
		self.action_signer_ids(action_id)
			.get()
			.iter()
			.map(|signer_id| self.user_mapper().get_user_address_unchecked(*signer_id))
			.collect()
	}

	#[view(getActionSignerCount)]
	fn get_action_signer_count(&self, action_id: usize) -> usize {
		self.action_signer_ids(action_id).get().len()
	}

	/// It is possible for board members to lose their role.
	/// They are not automatically removed from all actions when doing so,
	/// therefore the contract needs to re-check every time when actions are performed.
	/// This function is used to validate the signers before performing an action.
	/// It also makes it easy to check before performing an action.
	#[view(getActionValidSignerCount)]
	fn get_action_valid_signer_count(&self, action_id: usize) -> usize {
		let signer_ids = self.action_signer_ids(action_id).get();
		signer_ids
			.iter()
			.filter(|signer_id| {
				let signer_role = self.get_user_id_to_role(**signer_id);
				signer_role.can_sign()
			})
			.count()
	}

	#[view(quorumReached)]
	fn quorum_reached(&self, action_id: usize) -> bool {
		let min_valid = self.min_valid().get();
		let valid_signers_count = self.get_action_valid_signer_count(action_id);
		valid_signers_count >= min_valid
	}

	fn perform_action(&self, action: Action<Self::BigUint>) -> SCResult<PerformActionResult<Self::SendApi>> {
		match action {
			Action::Nothing => Ok(PerformActionResult::Nothing),
			Action::AddValidator(addr) => {
				self.change_user_role(addr, UserRole::Validator);
				Ok(PerformActionResult::Nothing)
			},
			Action::RemoveUser(user_address) => {
				self.change_user_role(user_address, UserRole::None);
				let num_board_members = self.num_validators().get();
				require!(
					num_board_members > 0,
					"cannot remove all board members and proposers"
				);
				require!(
					self.min_valid().get() <= num_board_members,
					"quorum cannot exceed board size"
				);
				Ok(PerformActionResult::Nothing)
			},
			Action::ChangeMinValid(new_quorum) => {
				require!(
					new_quorum <= self.num_validators().get(),
					"quorum cannot exceed board size"
				);
				self.min_valid().set(&new_quorum);
				Ok(PerformActionResult::Nothing)
			},
			Action::SendXP { to, amount, data } => {
				self.send().esdt_local_mint(self.blockchain().get_gas_left(), XPTOKEN_IDENT, &amount);
				Ok(PerformActionResult::SendXP(SendToken {
					api: self.send(),
					to,
					token: XPTOKEN_IDENT.into(),
					amount,
					data
				}))
			},
		}
	}
}
