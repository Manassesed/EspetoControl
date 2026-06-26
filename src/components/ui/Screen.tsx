import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, type ScrollViewProps } from "react-native";

type ScreenProps = ScrollViewProps & {
  scroll?: boolean;
};

// Em telas largas (web/desktop), trava o conteúdo numa coluna de leitura confortável
// em vez de esticar o layout de celular borda a borda. Não afeta celular (largura < 560).
const MAX_CONTENT_WIDTH = 560;

export function Screen({ children, scroll = true, className = "", ...props }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top"]}>
      {scroll ? (
        <ScrollView
          className={`flex-1 ${className}`}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 110,
            gap: 10,
            width: "100%",
            maxWidth: MAX_CONTENT_WIDTH,
            alignSelf: "center"
          }}
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" }}>{children}</View>
      )}
    </SafeAreaView>
  );
}
