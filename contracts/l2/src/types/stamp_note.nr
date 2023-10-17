use dep::aztec::note::{
    note_header::NoteHeader,
    note_interface::NoteInterface,
    utils::compute_note_hash_for_read_or_nullify,
};

global STAMP_SERIALISED_NOTE_LEN: Field = 5;

struct StampNote {
    // typpe of stamp
    stamp_type: u8,
    // timestamp of when the stamp was issued
    timestamp: Field,
    // up to 93 bytes of data
    data: [Field; 3],
    header: NoteHeader
}

impl StampNote {
    fn new(stamp_type: u8, timestamp: Field, data: [Field; 3]) -> Self {
        Self { stamp_type, timestamp, data, header: NoteHeader::empty() }
    }

    fn deserialise(self) -> [Field; STAMP_SERIALISED_NOTE_LEN] {
        [self.stamp_type as Field, self.timestamp, self.data[0], self.data[1], self.data[2]]
    }

    fn deserialise(preimage: [Field; STAMP_SERIALISED_NOTE_LEN]) -> Self {
        StampNote {
            stamp_type: preimage[0] as u8,
            timestamp: preimage[1],
            data: [preimage[2], preimage[3], preimage[4]],
        }
    }

    fn compute_note_hash(self) -> Field {
        dep::std::hash::pedersen([
            self.stamp_type as Field,
            self.timestamp,
            self.data[0],
            self.data[1],
            self.data[2],
        ])
    }

    fn set_header(&mut self, header: NoteHeader) {
        self.header
    }
}

fn deserialise(preimage: [Field; STAMP_SERIALISED_NOTE_LEN]) -> StampNote {
    StampNote::deserialise(preimage)
}

fn serialise(note: StampNote) -> [Field; STAMP_SERIALISED_NOTE_LEN] {
    note.deserialise()
}

fn compute_note_hash(note: StampNote) -> Field {
    note.compute_note_hash()
}

fn get_header(note: PlayerStateNote) -> Field {
    note.header
}

fn set_header(note: &mut PlayerStateNote, header: NoteHeader) {
    note.set_header(header)
}

global StampNoteMethods = NoteInterface {
    deserialise,
    serialise,
    compute_note_hash,
    compute_nullifier,
    get_header,
    set_header
};