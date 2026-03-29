import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";


actor {
  include MixinStorage();

  type MediaItem = {
    id : Nat;
    blob : Storage.ExternalBlob;
    mediaType : Text;
    title : Text;
    timestamp : Int;
  };

  var mediaIdCount = 0;
  let mediaStore = Map.empty<Nat, MediaItem>();

  public shared ({ caller }) func addMedia(blob : Storage.ExternalBlob, mediaType : Text, title : Text) : async MediaItem {
    mediaIdCount += 1;
    let newMedia : MediaItem = {
      id = mediaIdCount;
      blob;
      mediaType;
      title;
      timestamp = Time.now();
    };
    mediaStore.add(mediaIdCount, newMedia);
    newMedia;
  };

  public shared ({ caller }) func deleteMedia(id : Nat) : async Bool {
    switch (mediaStore.get(id)) {
      case (?_) {
        mediaStore.remove(id);
        true;
      };
      case null {
        false;
      };
    };
  };

  public query ({ caller }) func getMedia() : async [MediaItem] {
    mediaStore.values().toArray().sort(
      func(a, b) {
        Nat.compare(b.id, a.id);
      }
    );
  };
};
