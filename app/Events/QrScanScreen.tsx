import React, { useEffect, useRef, useState } from "react";
import { CameraView } from "expo-camera";
import { Stack } from "expo-router";
import { AppState, Linking, Platform, SafeAreaView, StatusBar, StyleSheet, Button } from "react-native";
import { Overlay } from "./Overlay";

export default function QrScanScreen() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
        setIsScanning(true); // Reset scanning state when app comes back to active
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleScanAgain = () => {
    qrLock.current = false;
    setIsScanning(true);
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen
        options={{
          title: "Overview",
          headerShown: false,
        }}
      />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      {isScanning && (
        <CameraView
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} // Semi-transparent background
          facing="back"
          onBarcodeScanned={({ data }) => {
            if (data && !qrLock.current) {
              qrLock.current = true;
              setIsScanning(false);
              setTimeout(async () => {
                await Linking.openURL(data);
              }, 500);
            }
          }}
        />
      )}
      <Overlay />
      <Button title="Scan Again" onPress={handleScanAgain} />
    </SafeAreaView>
  );
}
