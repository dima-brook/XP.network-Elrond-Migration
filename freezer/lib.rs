#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod freezer {
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
        to: AccountId,
        value: Balance
    }

    impl Freezer {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self { validators: Default::default() }
        }

        /// Emit a transfer event while locking
        /// existing coins
        /// TODO: Support Xpub
        #[ink(message)]
        #[ink(payable)]
        pub fn send(&mut self, to: AccountId) {
            self.env().emit_event( Transfer {
                to,
                value: self.env().transferred_balance()
            } )
        }

        /// unfreeze tokens and send them to an address
        /// only validators can call this
        #[ink(message)]
        pub fn pop(&mut self, to: AccountId, value: Balance) -> Result<bool, ()> {
            if self.validators.get(&self.env().caller()).is_some() {
                self.env().transfer(to, value).map_err(|_| ())?; // TODO: Return concrete error
                Ok(true)
            } else {
                Ok(false)
            }
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
        fn validator_cnt(&mut self) -> u32 {
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

/*        #[ink::test]
        fn send_test() {
            let freezer = Freezer::default();
            let addr = H160::from_str("0xerd1yflgh7duhhvpkqkqqjrcnz7j6pqnhy8kepglkk6k8h8dfu3as3ysdcxan8");
            freezer.send(addr.clone().to_fixed_bytes());
            let evs = ink_env::test::recorded_events().collect::<Vec<_>>();
            assert_eq!(evs.len(), 1);
            assert_eq!(evs[0].value, 0);
        }*/ // TODO: Fix this test

        /// Check if validators can pop transactions properly
        #[ink::test]
        fn pop() {
            let mut freezer = Freezer::default();
            let acc = [0; 32];
            assert_eq!(freezer.pop(acc.clone().into(), 0x0), Ok(false));

            freezer.subscribe();
            assert_eq!(freezer.pop(acc.clone().into(), 0x0), Ok(true));
            assert_eq!(freezer.pop(acc.clone().into(), 1).is_err(), true);
        }
    }
}
