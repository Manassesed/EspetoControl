import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { addMonths, dayKey, formatMonthYear, isToday, startOfMonth } from "@/utils/date";

type CalendarModalProps = {
  visible: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

// Seg Ter Qua Qui Sex Sáb Dom
const weekDayLabels = ["S", "T", "Q", "Q", "S", "S", "D"];

function buildMonthGrid(monthStart: Date) {
  // Converte getDay() (0=Dom) para posição com semana iniciando na segunda (0=Seg)
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
  }
  return cells;
}

export function CalendarModal({ visible, selectedDate, onSelect, onClose }: CalendarModalProps) {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(selectedDate));

  useEffect(() => {
    if (visible) setVisibleMonth(startOfMonth(selectedDate));
  }, [visible, selectedDate]);

  const cells = buildMonthGrid(visibleMonth);
  const monthLabel = formatMonthYear(visibleMonth);
  const selectedKey = dayKey(selectedDate);
  const today = new Date();
  const disableNext = startOfMonth(visibleMonth) >= startOfMonth(today);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-4" onPress={() => {}}>
          <View className="mb-3 items-center">
            <View className="h-1.5 w-12 rounded-full bg-slate-200" />
          </View>

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[15px] font-semibold text-ink">Escolher data</Text>
            <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-slate-100" onPress={onClose}>
              <Ionicons name="close" size={16} color="#0F172A" />
            </Pressable>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50"
              onPress={() => setVisibleMonth((m) => addMonths(m, -1))}
            >
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
            </Pressable>
            <Text className="text-[13px] font-semibold text-ink">{monthLabel}</Text>
            <Pressable
              className={`h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${disableNext ? "opacity-30" : ""}`}
              onPress={() => !disableNext && setVisibleMonth((m) => addMonths(m, 1))}
              disabled={disableNext}
            >
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>
          </View>

          <View className="flex-row">
            {weekDayLabels.map((label, i) => (
              <View key={i} className="flex-1 items-center py-1">
                <Text className="text-[11px] font-semibold text-muted">{label}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {cells.map((cellDate, index) => {
              if (!cellDate) {
                return <View key={`empty-${index}`} style={{ width: "14.28%" }} className="h-11" />;
              }
              const key = dayKey(cellDate);
              const selected = key === selectedKey;
              const todayCell = isToday(cellDate);
              const future = cellDate > today;

              return (
                <View key={key} style={{ width: "14.28%" }} className="h-11 items-center justify-center">
                  <Pressable
                    className={`h-9 w-9 items-center justify-center rounded-full ${
                      selected ? "bg-ink" : todayCell ? "bg-brand-50" : ""
                    } ${future ? "opacity-30" : ""}`}
                    disabled={future}
                    onPress={() => {
                      onSelect(cellDate);
                      onClose();
                    }}
                  >
                    <Text
                      className={`text-[13px] font-medium ${
                        selected ? "text-white" : todayCell ? "text-brand-700" : "text-ink"
                      }`}
                    >
                      {cellDate.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
