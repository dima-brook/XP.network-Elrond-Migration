#![no_std]

mod action;
mod user_role;

use action::{Action, ActionInfo, PerformActionResult};

use user_role::UserRole;
use elrond_wasm::String;

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

	/// id: Action
	#[storage_mapper("action_data")]
	fn action_mapper(&self) -> MapMapper<Self::Storage, Self::BigUint, ActionInfo<Self::BigUint>>;

	/// Supported Wrapper Token name
	#[view(token)]
	#[storage_mapper("token")]
	fn token(&self) -> SingleValueMapper<Self::Storage, TokenIdentifier>;

	/// Nft token wrapper name
	#[view(nft_token)]
	#[storage_mapper("nft_token")]
	fn nft_token(&self) -> SingleValueMapper<Self::Storage, TokenIdentifier>;

    /// Contract constructor
	#[init]
	fn init(&self, token: TokenIdentifier, nft_token: TokenIdentifier, min_valid: usize, #[var_args] validators: VarArgs<Address>) -> SCResult<()> {
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
		self.nft_token().set(&nft_token);
	
		Ok(())
	}

    /// Freeze EGLD and send to Polkadot
	#[payable("EGLD")]
	#[endpoint(freezeSend)]
	fn freeze_send(&self, #[payment] value: Self::BigUint, to: String) -> SCResult<()> {
		require!(value > 0, "Value must be > 0");

		self.transfer_event(to, value);

		Ok(())
	}

	/// Freeze NFT
	#[payable("*")]
	#[endpoint(freezeSendNft)]
	fn freeze_send_nft(&self, #[payment_token] token: TokenIdentifier, #[payment] value: Self::BigUint, #[payment_nonce] nonce: u64, to: String) -> SCResult<()> {
		require!(nonce > 0, "Not an NFT!");
		require!(value == 1, "SFTs not supported!");

		self.transfer_nft_event(to, token, nonce);

		Ok(())
	}

	#[payable("*")]
	#[endpoint(withdrawNft)]
	fn withdraw_nft(&self, #[payment_token] token: TokenIdentifier, #[payment_nonce] nonce: u64, to: String) -> SCResult<()> {
		require!(token == self.nft_token().get(), "Invalid token!");
		require!(nonce > 0, "Not an NFT!");

        let sc_addr = self.blockchain().get_sc_address();
        let id = self.blockchain().get_esdt_token_data(&sc_addr, &token, nonce).name;

		self.send().esdt_local_burn(&token, nonce, &1u32.into());

		self.unfreeze_nft_event(to, id);

		Ok(())
	}

    /// Unfreeze polkadot token
	#[payable("*")]
	#[endpoint(withdraw)]
	fn withdraw(&self, #[payment] value: Self::BigUint, #[payment_token] token: TokenIdentifier, to: String)  -> SCResult<()> {
		require!(value > 0, "Value must be > 0");
		require!(token == self.token().get(), "Invalid token!");

		self.send().esdt_local_burn(&token, &value);

		self.unfreeze_event(to, value);

		Ok(())
	}

    /// Call external smart contract on polkadot
	#[endpoint(sendScCall)]
	fn send_sc_call(&self, to: String, endpoint: String, #[var_args] args: VarArgs<BoxedBytes>) {
		self.rpc_event(to, Self::BigUint::zero(), endpoint, args.into_vec());
	}

	#[payable("*")]
	#[endpoint(deposit)]
	fn deposit(&self) {}

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

    /// Inform that the given action is valid
	fn validate_action(&self, id: Self::BigUint, action: Action<Self::BigUint>) -> SCResult<PerformActionResult<Self::SendApi>> {
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
			.or_insert_with(|| ActionInfo::new(ac, Vec::with_capacity(self.num_validators().get()), 0))
			.update(|ActionInfo { signers, .. }| {
				if signers.contains(&caller_id) {
					ret = true;
					return;
				}

				signers.push(caller_id);
				valid_signers_count = signers.len();
			});

		if ret {
			return Ok(PerformActionResult::Pending);
		}

		let min_valid = self.min_valid().get();

		if valid_signers_count == min_valid {
			let res = self.perform_action(action);
            action_mapper.remove(&id).unwrap();

            return res;
		}
	
		Ok(PerformActionResult::Pending)
	}

	/// Initiates board member addition process.
	/// Can also be used to promote a proposer to board member.
	#[endpoint(proposeAddValidator)]
	fn propose_add_validator(&self, uuid: Self::BigUint, board_member_address: Address) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid, Action::AddValidator(board_member_address))
	}

	/// Removes user regardless of whether it is a board member or proposer.
	#[endpoint(proposeRemoveUser)]
	fn propose_remove_user(&self, uuid: Self::BigUint, user_address: Address) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid, Action::RemoveUser(user_address))
	}

	/// Change validator threshould
	#[endpoint(proposeChangeMinValid)]
	fn propose_change_min_valid(&self, uuid: Self::BigUint, new_quorum: usize) -> SCResult<PerformActionResult<Self::SendApi>>  {
		self.validate_action(uuid, Action::ChangeMinValid(new_quorum))
	}

    /// Unfreeze frozen EGLD
	#[endpoint(validateUnfreeze)]
	fn validate_unfreeze(
		&self,
		uuid: Self::BigUint,
		to: Address,
		amount: Self::BigUint
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid, Action::Unfreeze { to, amount })
	}

	#[endpoint(validateUnfreezeNft)]
	fn validate_unfreeze_nft(
		&self,
		uuid: Self::BigUint,
		to: Address,
		token: TokenIdentifier,
		nonce: u64
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid, Action::UnfreezeNft { to, token, nonce })
	}

	/// Send polkadot wrapper tokens to target
	#[endpoint(validateSendXp)]
	fn validate_send_xp(
		&self,
		uuid: Self::BigUint,
		to: Address,
		amount: Self::BigUint,
		#[var_args] opt_data: OptionalArg<BoxedBytes>,
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		let data = match opt_data {
			OptionalArg::Some(data) => data,
			OptionalArg::None => BoxedBytes::empty(),
		};
		self.validate_action(uuid, Action::SendXP { to, amount, data })
	}

	#[endpoint(validateSendNft)]
	fn validate_send_nft(
		&self,
		uuid: Self::BigUint,
		to: Address,
		id: BoxedBytes,
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid, Action::SendNft { to, id })
	}

    /// Call smart contract on elrond
	#[payable("EGLD")]
	#[endpoint(validateSCCall)]
	fn validate_sc_call(
		&self,
		#[payment] amount: Self::BigUint,
		uuid: Self::BigUint,
		to: Address,
		endpoint: BoxedBytes,
		#[var_args] args: VarArgs<BoxedBytes>,
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid,
			Action::SCCall {
				to,
				amount,
				endpoint,
				args: args.into_vec(),
			}
		)
	}


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

    /// Actual logic for executing an action
	fn perform_action(&self, action: Action<Self::BigUint>) -> SCResult<PerformActionResult<Self::SendApi>> {
		match action {
			Action::Nothing => Ok(PerformActionResult::Done),
			Action::AddValidator(addr) => {
				self.change_user_role(addr, UserRole::Validator);
				Ok(PerformActionResult::Done)
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
				Ok(PerformActionResult::Done)
			},
			Action::ChangeMinValid(new_quorum) => {
				require!(
					new_quorum <= self.num_validators().get(),
					"quorum cannot exceed board size"
				);
				self.min_valid().set(&new_quorum);
				Ok(PerformActionResult::Done)
			},
			Action::SendXP { to, amount, data } => {
				let token = self.token().get();
				self.send().esdt_local_mint(&token, 0, &amount);
				Ok(PerformActionResult::SendXP(SendToken {
					api: self.send(),
					to,
					token: token.into(),
					amount,
					data
				}))
			},
			Action::SendNft { to, id } => {
				let ident = self.nft_token().get();
				self.send().esdt_nft_create(
					&ident,
					&(1u32.into()),
					&id,
					&Self::BigUint::zero(),
					&BoxedBytes::empty(),
					&(),
					&[BoxedBytes::empty()]
				);

				let sc_addr = self.blockchain().get_sc_address();
				let nonce = self.blockchain().get_current_esdt_nft_nonce(&sc_addr, &ident);

				self.send().transfer_esdt_via_async_call(&to, &ident, nonce, &1u32.into(), &[]);
				Ok(PerformActionResult::Done)
			},
			Action::SCCall {
				to,
				amount,
				endpoint,
				args
			} => {
				let mut contract_call_raw =
					ContractCall::<Self::SendApi, ()>::new(self.send(), to, endpoint)
						.with_token_transfer(TokenIdentifier::egld(), amount);
				for arg in args {
					contract_call_raw.push_argument_raw_bytes(arg.as_slice());
				}
				Ok(PerformActionResult::AsyncCall(
					contract_call_raw.async_call(),
				))
			},
			Action::Unfreeze {
				to,
				amount
			} => {
				Ok(PerformActionResult::Unfreeze(SendEgld {
					api: self.send(),
					to,
					amount,
					data: BoxedBytes::empty()
				}))
			},
			Action::UnfreezeNft {
				to,
				token,
				nonce
			} => {
				let sc_addr = self.blockchain().get_sc_address();

				self.send().transfer_esdt_via_async_call(&to, &token, nonce, &1u32.into(), &[]);
				Ok(PerformActionResult::Done)
			}
		}
	}

	// Events
	#[event("Unfreeze")]
	fn unfreeze_event(
		&self,
		#[indexed] to: String,
		#[indexed] value: Self::BigUint
	);

	#[event("UnfreezeNft")]
	fn unfreeze_nft_event(
		&self,
		#[indexed] to: String,
		#[indexed] id: BoxedBytes
	);

	#[event("Rpc")]
	fn rpc_event(
		&self,
		#[indexed] to: String,
		#[indexed] value: Self::BigUint,
		#[indexed] endpoint: String,
		#[indexed] args: Vec<BoxedBytes>
	);

	#[event("Transfer")]
	fn transfer_event(
		&self,
		#[indexed] to: String,
		#[indexed] value: Self::BigUint
	);

	#[event("TransferNft")]
	fn transfer_nft_event(
		&self,
		#[indexed] to: String,
		#[indexed] token: TokenIdentifier,
		#[indexed] nonce: u64
	);
}
