#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;
extern crate alloc;

#[ink::contract]
mod freezer {
    use bech32;
    use uuid::Uuid;
    use alloc::string::String;

    /// Contract Storage
    /// Stores a list of validators
    #[ink(storage)]
    pub struct Freezer {
        validators: ink_storage::collections::HashMap<AccountId, ()>, // O(1) contains
    }

    /// Transfer to elrond chain event
    /// validators must subscribe to this
    #[ink(event)]
    pub struct Transfer {
        action_id: u128,
        to: String,
        value: Balance
    }

    impl Freezer {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self { validators: Default::default() }
        }

        /// Emit a transfer event while locking
        /// existing coins
        /// TODO: Support elrond addr
        #[ink(message)]
        #[ink(payable)]
        pub fn send(&mut self, to: String) {
            bech32::decode(&to).unwrap();
            let val = self.env().transferred_balance();
            if val == 0 {
                panic!("Value must be > 0!")
            }
            self.env().emit_event( Transfer {
                action_id: Uuid::new_v4().as_u128(),
                to,
                value: val,
            } )
        }

        /// unfreeze tokens and send them to an address
        /// only validators can call this
        #[ink(message)]
        pub fn pop(&mut self, to: AccountId, value: Balance) -> bool {
            if self.validators.get(&self.env().caller()).is_some() {
                self.env().transfer(to, value).unwrap(); // TODO: Return concrete error
                return true;
            }
            return false;
        }

        /// Subscribe to events & become a validator
        /// TODO: Proper implementation
        #[ink(message)]
        #[ink(payable)]
        pub fn subscribe(&mut self) {
            self.validators.insert(self.env().caller(), ());
        }

        /// Number of validators
        /// only for debugging
        #[ink(message)]
        pub fn validator_cnt(&mut self) -> u32 {
            self.validators.len()
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// Imports `ink_lang` so we can use `#[ink::test]`.
        use ink_lang as ink;

        /// Check default impl 
        #[ink::test]
        fn default_works() {
            let mut freezer = Freezer::default();
            assert_eq!(freezer.validator_cnt(), 0);
        }

        /// Check if validators can be added
        #[ink::test]
        fn subscribe_test() {
            let mut freezer = Freezer::default();
            freezer.subscribe();
            assert_eq!(freezer.validator_cnt(), 1);
        }

        #[ink::test]
        fn send_test() {
            let mut freezer = Freezer::default();
            freezer.send("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th".to_string());
            let evs = ink_env::test::recorded_events().collect::<Vec<_>>();
            assert_eq!(evs.len(), 1);
        }

        /// Check if validators can pop transactions properly
        #[ink::test]
        fn pop() {
            let mut freezer = Freezer::default();
            let acc = [0; 32];
            assert!(!freezer.pop(acc.clone().into(), 0x0));

            freezer.subscribe();
            freezer.pop(acc.clone().into(), 0x0);
        }
    }
}
