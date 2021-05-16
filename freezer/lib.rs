#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod freezer {
    use sp_core::{H160};

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Freezer {
        validators: ink_storage::collections::HashMap<AccountId, ()>, // O(1) contains
    }

    #[ink(event)]
    pub struct Transfer {
        to: [u8; 20],
        value: Balance
    }

    impl Freezer {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self { validators: Default::default() }
        }

        #[ink(message)]
        #[ink(payable)]
        pub fn send(&mut self, to: [u8; 20]) {
            let h160 = H160::from_slice(&to);
            self.env().emit_event( Transfer {
                to: h160.to_fixed_bytes(),
                value: self.env().transferred_balance()
            } )
        }

        #[ink(message)]
        pub fn pop(&mut self, to: AccountId, value: Balance) -> bool {
            if self.validators.get(&self.env().caller()).is_some() {
                if let Err(_) = self.env().transfer(to, value) {
                    return false; // TODO: Nuke validator on fail
                }
                true
            } else {
                false
            }
        }

        #[ink(message)]
        #[ink(payable)]
        pub fn subscribe(&mut self) {
            self.validators.insert(self.env().caller(), ());
        }

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

        /// We test if the default constructor does its job.
        #[ink::test]
        fn default_works() {
            let freezer = Freezer::default();
            assert_eq(freezer.validator_cnt(), 0);
        }

        /// We test a simple use case of our contract.
        #[ink::test]
        fn it_works() {
            assert_eq!(freezer.get().validaton, true);
        }
    }
}
