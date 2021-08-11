#![no_std]

mod action;
mod events;
mod user_role;

use action::{Action, ActionInfo, PerformActionResult};
use events::*;
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
	fn action_mapper(&self) -> SafeMapMapper<Self::Storage, Self::BigUint, ActionInfo<Self::BigUint>>;

	/// Supported Wrapper Token name
	#[view(token)]
	#[storage_mapper("token")]
	fn token(&self) -> SingleValueMapper<Self::Storage, TokenIdentifier>;

    #[view(prevSftNonce)]
    #[storage_mapper("sft_nonce")]
    fn sft_nonce(&self) -> SingleValueMapper<Self::Storage, u64>;

	/// Nft token wrapper name
	#[view(nft_token)]
	#[storage_mapper("nft_token")]
	fn nft_token(&self) -> SingleValueMapper<Self::Storage, TokenIdentifier>;

    /// Workaround events
	#[storage_mapper("events")]
	fn event_mapper(&self) -> SafeMapMapper<Self::Storage, Self::BigUint, EventInfo<Self::BigUint>>;

    /// Identifier of the latest event
	#[storage_mapper("event_ident")]
	fn event_ident(&self) -> SingleValueMapper<Self::Storage, Self::BigUint>;

	fn event_ident_inc(&self) -> Self::BigUint {
		self.event_ident().update(|event| {
			event.add_assign(Self::BigUint::from(1u64));
			event.clone()
		})
	}

	fn insert_event(&self, event: EventInfo<Self::BigUint>) -> Self::BigUint {
		let ident = self.event_ident_inc();
		self.event_mapper().insert(ident.clone(), event);
		ident
	}

    /// Read an event
    /// only validators are allowed to call this
	#[endpoint(eventRead)]
	fn event_read(&self, id: Self::BigUint) -> SCResult<EventInfo<Self::BigUint>> {
		let caller_address = self.blockchain().get_caller();
		let caller_id = self.user_mapper().get_user_id(&caller_address);
		let caller_role = self.get_user_id_to_role(caller_id);
		require!(caller_role.can_sign(), "only validators can check events");

		let mut event_mapper = self.event_mapper();
		let info = event_mapper.get(&id);
		if info.is_none() {
			return sc_error!("Invalid ID!");
		}
		let mut info = info.unwrap();

		info.read_cnt += 1;
		if info.read_cnt == self.num_validators().get() {
			event_mapper.remove(&id).unwrap();
		} else {
			event_mapper.insert(id, info.clone()).unwrap();
		}

		return Ok(info);
	}

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
		self.event_ident().set(&Self::BigUint::zero());
        self.sft_nonce().set(&0);
	
		Ok(())
	}

    /// Freeze EGLD and send to chain
	#[payable("EGLD")]
	#[endpoint(freezeSend)]
	fn freeze_send(&self, #[payment] value: Self::BigUint, chain_nonce: u64, to: String) -> SCResult<Self::BigUint> {
		require!(value > 0, "Value must be > 0");

		let ident = self.insert_event(EventInfo::new(Event::Transfer { chain_nonce, to, value }));

		Ok(ident)
	}

	/// Freeze NFT
	#[payable("*")]
	#[endpoint(freezeSendNft)]
	fn freeze_send_nft(&self, #[payment_token] token: TokenIdentifier, #[payment] value: Self::BigUint, #[payment_nonce] nonce: u64, chain_nonce: u64, to: String) -> SCResult<Self::BigUint> {
		require!(nonce > 0, "Not an NFT!");
		require!(value == 1, "SFTs not supported!");

		let ident = self.insert_event(EventInfo::new(Event::TransferNft { chain_nonce, to, token, nonce }));

		Ok(ident)
	}

	#[payable("*")]
	#[endpoint(withdrawNft)]
	fn withdraw_nft(&self, #[payment_token] token: TokenIdentifier, #[payment_nonce] nonce: u64, to: String) -> SCResult<Self::BigUint> {
		require!(token == self.nft_token().get(), "Invalid token!");
		require!(nonce > 0, "Not an NFT!");

        let sc_addr = self.blockchain().get_sc_address();
        let mut dat = self.blockchain().get_esdt_token_data(&sc_addr, &token, nonce);
        let id = dat.uris.remove(0);
        let chain_nonce = u64::top_decode(dat.attributes.into_box()).unwrap();

		self.send().esdt_local_burn(&token, nonce, &1u32.into());

		let ident = self.insert_event(EventInfo::new(Event::UnfreezeNft { chain_nonce, to, id }));

		Ok(ident)
	}

    /// Unfreeze polkadot token
	#[payable("*")]
	#[endpoint(withdraw)]
	fn withdraw(&self, #[payment] value: Self::BigUint, #[payment_token] token: TokenIdentifier, #[payment_nonce] chain_nonce: u64, to: String)  -> SCResult<Self::BigUint> {
		require!(value > 0, "Value must be > 0");
		require!(token == self.token().get(), "Invalid token!");

		self.send().esdt_local_burn(&token, chain_nonce, &value);

		let ident = self.insert_event(EventInfo::new(Event::Unfreeze { chain_nonce, to, value }));
	
		Ok(ident)
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

	/// Send wrapper tokens to target
	#[endpoint(validateSendWrapped)]
	fn validate_send_wrapped(
		&self,
		uuid: Self::BigUint,
        chain_nonce: u64,
		to: Address,
		amount: Self::BigUint,
		#[var_args] opt_data: OptionalArg<BoxedBytes>,
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		let data = match opt_data {
			OptionalArg::Some(data) => data,
			OptionalArg::None => BoxedBytes::empty(),
		};
		self.validate_action(uuid, Action::SendWrapped { chain_nonce, to, amount, data })
	}

	#[endpoint(validateSendNft)]
	fn validate_send_nft(
		&self,
		uuid: Self::BigUint,
        chain_nonce: u64,
		to: Address,
		id: BoxedBytes,
	) -> SCResult<PerformActionResult<Self::SendApi>> {
		self.validate_action(uuid, Action::SendNft { chain_nonce, to, id })
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
			Action::SendWrapped { chain_nonce, to, amount, data } => {
                let token = self.token().get();
                let mut nonce = self.sft_nonce().get();
                while nonce < chain_nonce {
                    self.send().esdt_nft_create(
                        &token,
                        &(2u32.into()), // This can never be burnt
                        &BoxedBytes::empty(),
                        &Self::BigUint::zero(),
                        &BoxedBytes::empty(),
                        &BoxedBytes::empty(),
                        &[BoxedBytes::empty()]
                    );
                    self.sft_nonce().set(&(nonce+1));
                    nonce += 1;
                }

				self.send().esdt_local_mint(&token, chain_nonce, &amount);

                self.send().transfer_esdt_via_async_call(
                    &to,
                    &token,
                    chain_nonce,
                    &amount,
                    data.as_slice()
                )
			},
			Action::SendNft { chain_nonce, to, id } => {
				let ident = self.nft_token().get();
				let nonce = self.send().esdt_nft_create(
					&ident,
					&(1u32.into()),
					&BoxedBytes::empty(),
					&Self::BigUint::zero(),
					&BoxedBytes::empty(),
					&chain_nonce,
					&[id]
				);

				self.send().transfer_esdt_via_async_call(&to, &ident, nonce, &1u32.into(), &[]);
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
				self.send().transfer_esdt_via_async_call(&to, &token, nonce, &1u32.into(), &[]);
			}
		}
	}
}
