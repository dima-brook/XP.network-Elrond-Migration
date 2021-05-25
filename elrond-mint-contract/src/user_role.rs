elrond_wasm::derive_imports!();

/// Valid user roles
#[derive(TopEncode, TopDecode, TypeAbi, Clone, Copy, PartialEq)]
pub enum UserRole {
	None,
	Validator
}

impl UserRole {
	/// Whether a user is a validator
	pub fn can_sign(&self) -> bool {
		matches!(*self, UserRole::Validator)
	}
}
