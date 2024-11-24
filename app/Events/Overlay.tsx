import React from 'react';
import { View, Dimensions, StyleSheet, Platform, Button } from 'react-native';

const { width, height } = Dimensions.get("window");

const innerDimension = 300;

export const Overlay = ({ onScanAgain }) => {
  return (
    <View style={styles.container}>
      <View style={styles.outer}> 
        <View style={styles.inner} />
        <View style={styles.buttonContainer}>
          <Button title="Scan Again" onPress={onScanAgain} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: innerDimension,
    height: innerDimension,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Add semi-transparent background to outer overlay
    borderWidth: 2,
    borderColor: 'white', // Add a border to distinguish it
  },
  buttonContainer: {
    marginTop: 20, // Add space between inner view and button
  },
});

export default Overlay;
