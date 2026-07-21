import Ionicons from "@expo/vector-icons/Ionicons";
import { Component, type ReactNode } from "react";
import { Platform, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";

type Props = { children: ReactNode };
type State = { error: Error | null };

// Sem isso, qualquer erro de render não tratado deixa a tela em branco (o
// React desmonta a árvore inteira) sem nenhuma pista do que aconteceu.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("ErrorBoundary capturou um erro:", error, info.componentStack);
  }

  handleReset = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
        <Text className="text-center text-[16px] font-bold text-ink">Algo deu errado</Text>
        <Text selectable className="max-w-[320px] text-center text-[12px] text-muted">
          {error.message || String(error)}
        </Text>
        <Button title="Tentar novamente" icon="refresh-outline" onPress={this.handleReset} />
      </View>
    );
  }
}
