use dep::aztec::context::{PrivateContext, PublicContext};
use dep::aztec::state_vars::{
    map::Map,
    set::Set,
    singleton::Singleton,
    public_state::PublicState
    address
};
use dep::aztec::types::type_serialisation::field_serialisation::{
    FieldSerialisationMethods,
    FIELD_SERIALISED_LEN
};
use dep::address_note::address_note::{
    AddressNote,
    AddressNoteMethods,
    ADDRESS_NOTE_LEN
};
use dep::std::option::Option;
use crate::types::{
    stamp_note::{ StampNote, StampNoteMethods, STAMP_SERIALISED_NOTE_LEN },
};

mod StorageSlots {
    global BACKEND_ID = 1;
    global STAMP_TYPE_ID = 2;
    global STAMPS_ID = 3;
}

struct Storage {
    backend: PublicState<AddressNote, ADDRESS_NOTE_LEN>,
    stamp_type: Map<PublicState<Field, FIELD_SERIALISED_LEN>>,
    stamps: Map<Set<StampNote, STAMP_SERIALISED_NOTE_LEN>>
}

impl Storage {
    fn init(
        private_context: Option<&mut PrivateContext>,
        public_context: Option<&mut PublicContext>
    ) -> Self {
        Storage {
            backend: PublicState::new(
                private_context,
                public_context,
                StorageSlots::BACKEND_ID,
                AddressNoteMethods
            ),
            stamp: Map::new(
                private_context,
                public_context,
                StorageSlots::STAMP_TYPE_ID,
                |private_context, public_context, slot| PublicState::new(
                    private_context,
                    public_context,
                    slot,
                    FieldSerialisationMethods
                )
            ),
            stamps: Map::new(
                private_context,
                public_context,
                StorageSlots::STAMPS_ID,
                |private_context, public_context, slot| Singleton::new(
                    private_context,
                    public_context,
                    slot,
                    StampNoteMethods
                )
            )
        }
    }
}