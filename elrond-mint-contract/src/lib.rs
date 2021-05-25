#![no_std]

mod action;
mod events;
mod user_role;

use action::{Action, ActionInfo, PerformActionResult};
use user_role::UserRole;

elrond_wasm::imports!();


#[elrond_wasm_derive::contract]
pub trait Multisig {
	/// Validator Stroage
	#[storage_mapper("user")]
	fn user_mapper(&self) -> UserMapper<Self::Storage>;

	/// Validator threshould
	#[view(getMinValid)]
	#[storage_mapper("min_valid")]
	fn min_valid(&self) -> SingleValueMapper<Self::Storage, usize>;

	#[view(getUserRole)]
	#[storage_get("user_role")]
	fn get_user_id_to_role(&self, user_id: usize) -> UserRole;

	#[storage_set("user_role")]
	fn set_user_id_to_role(&self, user_id: usize, user_role: UserRole);

	/// Number of validators
	#[view(getNumValidators)]
	#[storage_mapper("num_validators")]
	fn num_validators(&self) -> SingleValueMapper<Self::Storage, usize>;

	/// TODO: Use proper events instead of manual storage
	/// Action: (Signs, executed, Num Event Received)
	#[storage_mapper("action_data")]
	fn action_mapper(&self) -> MapMapper<Self::Storage, Self::BigUint, ActionInfo<Self::BigUint>>;

	/// Supported Wrapper Token name
	#[storage_mapper("token")]
	fn token(&self) -> SingleValueMapper<Self::Storage, BoxedBytes>;

	fn set_executed(&self, id: Self::BigUint) {
		let mut action_mapper = self.action_mapper();
		let mut info = action_mapper.get(&id).unwrap();
		info.executed = true;
		action_mapper.insert(id, info);
	}

	#[init]
	fn init(&self, token: BoxedBytes, min_valid: usize, #[var_args] validators: VarArgs<Address>) -> SCResult<()> {
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

		self.token().set(&token);
	
		Ok(())
	}

	/// TODO
	#[payable("EGLD")]
	#[endpoint]
	fn freeze(&self) {}

	/// 1 if User is a validator
	#[view(userRole)]
	fn user_role(&self, user: Address) -> UserRole {
		let user_id = self.user_mapper().get_user_id(&user);
		if user_id == 0 {
			UserRole::None
		} else {
			self.get_user_id_to_role(user_id)
		}
	}

	fn validate_action(&self, id: Self::BigUint, action: Action<Self::BigUint>) -> SCResult<()> {
		let caller_address = self.blockchain().get_caller();
		let caller_id = self.user_mapper().get_user_id(&caller_address);
		let caller_role = self.get_user_id_to_role(caller_id);
		require!(
			caller_role.can_sign(),
			"only board members and proposers can propose"
		);

		let mut ret = false;
		let mut action_mapper = self.action_mapper();
		let mut valid_signers_count = 0;
		let ac = action.clone();
		action_mapper
			.entry(id.clone())
			.or_insert_with(|| ActionInfo::new(ac, Vec::with_capacity(self.num_validators().get()), false, 0))
			.update(|ActionInfo { signers, .. }| {
				if signers.contains(&caller_id) {
					ret = true;
					return;
				}

				signers.push(caller_id);
				valid_signers_count = signers.len();
			});

		let min_valid = self.min_valid().get();

		if valid_signers_count == min_valid {
			let res = self.perform_action(action);
			self.set_executed(id);

			return if let Err(e) = res {
				Err(e)
			} else {
				Ok(())
			};
		}
	
		Ok(())
	}

	/// Check if an action was completed
	/// Only validators can call this
	#[endpoint(executedCheck)]
	fn executed_check_event(&self, id: Self::BigUint) -> SCResult<bool> {
		let caller_address = self.blockchain().get_caller();
		let caller_id = self.user_mapper().get_user_id(&caller_address);
		let caller_role = self.get_user_id_to_role(caller_id);
		require!(caller_role.can_sign(), "only validators can check events");

		let mut action_mapper = self.action_mapper();
		let info = action_mapper.get(&id);
		if info.is_none() {
			return sc_error!("");
		}

		let mut info = info.unwrap();
		if !info.executed {
			return Ok(false);
		}

		info.event_recv_cnt += 1;
		if info.event_recv_cnt == self.num_validators().get() {
			action_mapper.remove(&id).unwrap();
		} else {
			action_mapper.insert(id, info).unwrap();
		}

		return Ok(true);
	}

	/// Initiates board member addition process.
	/// Can also be used to promote a proposer to board member.
	#[endpoint(proposeAddValidator)]
	fn propose_add_validator(&self, uuid: Self::BigUint, board_member_address: Address) -> SCResult<()> {
		self.validate_action(uuid, Action::AddValidator(board_member_address))
	}

	/// Removes user regardless of whether it is a board member or proposer.
	#[endpoint(proposeRemoveUser)]
	fn propose_remove_user(&self, uuid: Self::BigUint, user_address: Address) -> SCResult<()> {
		self.validate_action(uuid, Action::RemoveUser(user_address))
	}

	/// Change validator threshould
	#[endpoint(proposeChangeMinValid)]
	fn propose_change_min_valid(&self, uuid: Self::BigUint, new_quorum: usize) -> SCResult<()> {
		self.validate_action(uuid, Action::ChangeMinValid(new_quorum))
	}

	/// Send wrapper tokens
	#[endpoint(validateSendXp)]
	fn validate_send_xp(
		&self,
		uuid: Self::BigUint,
		to: Address,
		amount: Self::BigUint,
		#[var_args] opt_data: OptionalArg<BoxedBytes>,
	) -> SCResult<()> {
		let data = match opt_data {
			OptionalArg::Some(data) => data,
			OptionalArg::None => BoxedBytes::empty(),
		};
		self.validate_action(uuid, Action::SendXP { to, amount, data })
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
				let token = self.token().get();
				self.send().esdt_local_mint(self.blockchain().get_gas_left(), token.as_slice(), &amount);
				Ok(PerformActionResult::SendXP(SendToken {
					api: self.send(),
					to,
					token: token.into(),
					amount,
					data
				}))
			},
		}
	}
}
