elrond_wasm::derive_imports!();

#[derive(TopEncode, TopDecode, TypeAbi, Clone, Copy, PartialEq)]
pub enum UserRole {
	None,
	Validator
}

impl UserRole {
	pub fn can_sign(&self) -> bool {
		matches!(*self, UserRole::Validator)
	}
}
