import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function PreorderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedDeliveryDate, setSelectedDeliverySlot } = useApp();

  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else {
        label = d.toLocaleDateString('en-US', { weekday: 'long' });
      }

      const dateText = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      
      result.push({
        date: d,
        label,
        dateText,
        fullDateString: d.toDateString()
      });
    }
    return result;
  }, []);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setLocalSelectedSlot] = useState<string | null>(null);

  const timeSlots = useMemo(() => {
    const slots = [];
    const selectedDate = dates[selectedDateIndex].date;
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    // Create current time threshold with 30 mins prep time
    const currentHour = now.getHours();
    const currentMin = now.getMinutes() + 30; // 30 min buffer

    let startHour = 7;
    let startMin = 0;

    while (startHour < 24) {
      let endHour = startHour;
      let endMin = startMin + 45;
      
      if (endMin >= 60) {
        endHour++;
        endMin -= 60;
      }

      if (endHour >= 24 && endMin > 0) {
        // Last slot cut off at 11:59 PM
        const startAmPm = startHour >= 12 ? 'PM' : 'AM';
        const startH = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
        const startM = startMin.toString().padStart(2, '0');
        
        const slotText = `${startH}:${startM} ${startAmPm} - 11:59 PM`;
        slots.push({ text: slotText, disabled: false });
        break;
      } else if (endHour >= 24) {
        break;
      }

      const startAmPm = startHour >= 12 ? 'PM' : 'AM';
      const startH = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
      const startM = startMin.toString().padStart(2, '0');

      const endAmPm = endHour >= 12 ? 'PM' : 'AM';
      const endH = endHour > 12 ? endHour - 12 : (endHour === 0 ? 12 : endHour);
      const endM = endMin.toString().padStart(2, '0');

      const slotText = `${startH}:${startM} ${startAmPm} - ${endH}:${endM} ${endAmPm}`;
      
      let disabled = false;
      if (isToday) {
        // If the slot starts before current time + 30 mins, disable it
        const slotStartInMinutes = startHour * 60 + startMin;
        const currentInMinutes = now.getHours() * 60 + now.getMinutes() + 30;
        if (slotStartInMinutes < currentInMinutes) {
          disabled = true;
        }
      }

      slots.push({ text: slotText, disabled });

      startHour = endHour;
      startMin = endMin;
    }
    return slots;
  }, [selectedDateIndex]);

  const handleConfirm = () => {
    if (selectedSlot) {
      setSelectedDeliveryDate(dates[selectedDateIndex].fullDateString);
      setSelectedDeliverySlot(selectedSlot);
      router.push('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Select your delivery time</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {dates.map((d, index) => {
            const isSelected = selectedDateIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateItem, isSelected && styles.dateItemActive]}
                onPress={() => {
                  setSelectedDateIndex(index);
                  setLocalSelectedSlot(null); // Reset slot on date change
                }}
              >
                <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>{d.dateText}</Text>
                <Text style={[styles.dateLabel, isSelected && styles.dateLabelActive]}>{d.label}</Text>
                {isSelected && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Slots */}
      <ScrollView style={styles.slotsContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {timeSlots.map((slot, index) => {
          const isSelected = selectedSlot === slot.text;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.slotItem,
                isSelected && styles.slotItemActive,
                slot.disabled && styles.slotItemDisabled
              ]}
              disabled={slot.disabled}
              onPress={() => setLocalSelectedSlot(slot.text)}
            >
              <Text style={[
                styles.slotText,
                isSelected && styles.slotTextActive,
                slot.disabled && styles.slotTextDisabled
              ]}>
                {slot.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, !selectedSlot && styles.confirmButtonDisabled]}
          disabled={!selectedSlot}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream, 
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: Colors.deepTeal,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  dateContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dateScroll: {
    paddingHorizontal: 10,
  },
  dateItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  dateItemActive: {
    // Active styles handled by children mostly
  },
  dateText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateTextActive: {
    color: Colors.deepTeal,
  },
  dateLabel: {
    color: '#999',
    fontSize: 14,
  },
  dateLabelActive: {
    color: Colors.charcoal,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: Colors.orange, 
    borderRadius: 3,
  },
  slotsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  slotItem: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotItemActive: {
    backgroundColor: Colors.creamLight,
    borderColor: Colors.deepTeal,
  },
  slotItemDisabled: {
    backgroundColor: Colors.cream,
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  slotText: {
    color: Colors.charcoal,
    fontSize: 18,
    fontWeight: '600',
  },
  slotTextActive: {
    color: Colors.deepTeal,
  },
  slotTextDisabled: {
    color: '#999',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmButton: {
    backgroundColor: Colors.deepTeal,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
