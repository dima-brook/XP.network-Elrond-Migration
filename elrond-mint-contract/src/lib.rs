#![no_std]

mod action;
mod user_role;

use action::Action;
use user_role::UserRole;

imports!();

#[cfg(feature = "elrond-wasm-module-users-default")]
use elrond_wasm_module_users_default::*;
#[cfg(feature = "elrond-wasm-module-users-wasm")]
use elrond_wasm_module_users_wasm::*;

#[elrond_wasm_derive::contract(MultisigImpl)]
pub trait Multisig {
	#[module(UsersModuleImpl)]
	fn users_module(&self) -> UsersModuleImpl<T, BigInt, BigUint>;

	#[view(getMinValid)]
	#[storage_get("min_valid")]
	fn get_min_valid(&self) -> usize;

	#[storage_set("min_valid")]
	fn set_min_valid(&self, min_valid: usize);

	#[view(getUserRole)]
	#[storage_get("user_role")]
	fn get_user_id_to_role(&self, user_id: usize) -> UserRole;

	#[storage_set("user_role")]
	fn set_user_id_to_role(&self, user_id: usize, user_role: UserRole);

	#[view(getNumValdators)]
	#[storage_get("num_validators")]
	fn get_num_validators(&self) -> usize;

	#[storage_set("num_validators")]
	fn set_num_validators(&self, num_validators: usize);

	#[view(getActionLastIndex)]
	#[storage_get("action_last_index")]
	fn get_action_last_index(&self) -> usize;

	#[storage_set("action_last_index")]
	fn set_action_last_index(&self, action_last_index: usize);

	#[view(getPendingActionCount)]
	#[storage_get("pending_action_count")]
	fn get_pending_action_count(&self) -> usize;

	#[storage_set("pending_action_count")]
	fn set_pending_action_count(&self, pending_action_count: usize);

	#[view(getActionData)]
	#[storage_get("action_data")]
	fn get_action_data(&self, action_id: usize) -> Action<BigUint>;

	#[storage_set("action_data")]
	fn set_action_data(&self, action_id: usize, action_data: &Action<BigUint>);

	#[storage_is_empty("action_data")]
	fn is_empty_action_data(&self, action_id: usize) -> bool;

	#[storage_get("action_signer_ids")]
	fn get_action_signer_ids(&self, action_id: usize) -> Vec<usize>;

	#[storage_set("action_signer_ids")]
	fn set_action_signer_ids(&self, action_id: usize, action_signer_ids: &[usize]);

	#[init]
	fn init(&self, min_valid: usize, #[var_args] validators: VarArgs<Address>) -> SCResult<()> {
		require!(
			!validators.is_empty(),
			"validators cannot be empty on init, no-one would be able to propose"
		);
		require!(validators.len() <= validators.len(), "quorum cannot exceed board size");
		self.set_min_valid(min_valid);

		for (i, address) in validators.iter().enumerate() {
			let user_id = i + 1;
			self.users_module().set_user_id(&address, user_id);
			self.users_module().set_user_address(user_id, &address);
			self.set_user_id_to_role(user_id, UserRole::Validator);
		}
		self.users_module().set_num_users(validators.len());
		self.set_num_validators(validators.len());

		Ok(())
	}

	#[payable]
	#[endpoint]
	fn deposit(&self) {}

	#[view]
	fn signed(&self, user: Address, action_id: usize) -> bool {
		let user_id = self.users_module().get_user_id(&user);
		if user_id == 0 {
			false
		} else {
			let signer_ids = self.get_action_signer_ids(action_id);
			signer_ids.contains(&user_id)
		}
	}

	#[view(userRole)]
	fn user_role(&self, user: Address) -> UserRole {
		let user_id = self.users_module().get_user_id(&user);
		if user_id == 0 {
			UserRole::None
		} else {
			self.get_user_id_to_role(user_id)
		}
	}

	fn validate_action(&self, action: Action<BigUint>) -> SCResult<usize> {
		let caller_address = self.get_caller();
		let caller_id = self.users_module().get_user_id(&caller_address);
		let caller_role = self.get_user_id_to_role(caller_id);
		require!(
			caller_role.can_sign(),
			"only board members and proposers can propose"
		);

		let action_id = self.get_action_last_index() + 1;
		self.set_action_last_index(action_id);
		self.set_pending_action_count(self.get_pending_action_count() + 1);
		self.set_action_data(action_id, &action);
		self.set_action_signer_ids(action_id, &[caller_id].to_vec());

		let min_valid = self.get_min_valid();
		let valid_signers_count = self.get_action_valid_signer_count(action_id);

		if valid_signers_count == min_valid {
			let res = self.perform_action(action_id);
			return if let Ok(_) = res {
				Ok(action_id)
			} else {
				Err(res.err().unwrap())
			};
		} else if valid_signers_count > min_valid && valid_signers_count == self.get_num_validators() {
			// clean up storage
			self.set_action_data(action_id, &Action::Nothing);
			self.set_action_signer_ids(action_id, &[][..]);
			self.set_pending_action_count(self.get_pending_action_count() - 1);
		}
	
		Ok(action_id)
	}

	fn sign(&self, action_id: usize) -> SCResult<()> {
		require!(
			!self.is_empty_action_data(action_id),
			"action does not exist"
		);

		let caller_address = self.get_caller();
		let caller_id = self.users_module().get_user_id(&caller_address);
		let caller_role = self.get_user_id_to_role(caller_id);
		require!(caller_role.can_sign(), "only validators can sign");

		let mut signer_ids = self.get_action_signer_ids(action_id);
		if !signer_ids.contains(&caller_id) {
			signer_ids.push(caller_id);
			self.set_action_signer_ids(action_id, signer_ids.as_slice());
		}

		Ok(())
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
		amount: BigUint,
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
		let user_id = self.users_module().get_or_create_user(&user_address);
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
				self.set_num_validators(self.get_num_validators() - 1);
			}
		} else {
			if new_role == UserRole::Validator {
				self.set_num_validators(self.get_num_validators() + 1);
			}
		}
	}

	#[view(getActionSigners)]
	fn get_action_signers(&self, action_id: usize) -> Vec<Address> {
		self.get_action_signer_ids(action_id)
			.iter()
			.map(|signer_id| self.users_module().get_user_address(*signer_id))
			.collect()
	}

	#[view(getActionSignerCount)]
	fn get_action_signer_count(&self, action_id: usize) -> usize {
		self.get_action_signer_ids(action_id).len()
	}

	/// It is possible for board members to lose their role.
	/// They are not automatically removed from all actions when doing so,
	/// therefore the contract needs to re-check every time when actions are performed.
	/// This function is used to validate the signers before performing an action.
	/// It also makes it easy to check before performing an action.
	#[view(getActionValidSignerCount)]
	fn get_action_valid_signer_count(&self, action_id: usize) -> usize {
		let signer_ids = self.get_action_signer_ids(action_id);
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
		let min_valid = self.get_min_valid();
		let valid_signers_count = self.get_action_valid_signer_count(action_id);
		valid_signers_count >= min_valid
	}

	fn perform_action(&self, action_id: usize) -> SCResult<()> {
		let action = self.get_action_data(action_id);
		match action {
			Action::Nothing => {},
			Action::AddValidator(addr) => {
				self.change_user_role(addr, UserRole::Validator);
			},
			Action::RemoveUser(user_address) => {
				self.change_user_role(user_address, UserRole::None);
				let num_board_members = self.get_num_validators();
				require!(
					num_board_members > 0,
					"cannot remove all board members and proposers"
				);
				require!(
					self.get_min_valid() <= num_board_members,
					"quorum cannot exceed board size"
				);
			},
			Action::ChangeMinValid(new_quorum) => {
				require!(
					new_quorum <= self.get_num_validators(),
					"quorum cannot exceed board size"
				);
				self.set_min_valid(new_quorum)
			},
			Action::SendXP { to, amount, data } => {
				self.send_tx(&to, &amount, data.as_slice());
			},
		}

		Ok(())
	}
}
