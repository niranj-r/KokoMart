import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import Colors from '@/constants/colors';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
}

export default function OTPInput({ value, onChange, editable = true }: OTPInputProps) {
  const inputs = useRef<TextInput[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));

  // Sync state if value is cleared externally
  useEffect(() => {
    if (!value) {
      setDigits(Array(6).fill(''));
    } else {
      const parts = value.split('').slice(0, 6);
      const newDigits = [...parts, ...Array(6 - parts.length).fill('')];
      setDigits(newDigits);
    }
  }, [value]);

  const handleChangeText = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanText.slice(-1);
    setDigits(newDigits);

    const code = newDigits.join('');
    onChange(code);

    // Auto-focus next input if we typed a digit
    if (cleanText && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        inputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array(6).fill(0).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            if (ref) inputs.current[index] = ref;
          }}
          style={[
            styles.inputBox,
            digits[index] ? styles.inputBoxActive : null
          ]}
          keyboardType="numeric"
          maxLength={1}
          value={digits[index]}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          editable={editable}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 16,
  },
  inputBox: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    backgroundColor: Colors.creamLight,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  inputBoxActive: {
    borderColor: Colors.deepTeal,
    backgroundColor: Colors.white,
  },
});
