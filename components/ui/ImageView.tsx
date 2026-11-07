import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";

type ImageViewProps = {
  uri: string | null;
  onClose: () => void;
};

export function ImageView({ uri, onClose }: ImageViewProps) {
  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <Pressable
          onPress={onClose}
          className="absolute right-4 top-14 z-10 rounded-full bg-white/20 p-2"
        >
          <X size={22} color="#fff" />
        </Pressable>
        {uri ? (
          <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" />
        ) : null}
      </View>
    </Modal>
  );
}