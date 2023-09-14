import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, FlatList, Share } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedCIs, setScannedCIs] = useState(new Set());

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    const loadScannedCIs = async () => {
      try {
        const savedCIs = await AsyncStorage.getItem('scannedCIs');
        if (savedCIs) {
          setScannedCIs(new Set(JSON.parse(savedCIs)));
        }
      } catch (error) {
        console.error('Error loading CIs:', error);
      }
    };

    getBarCodeScannerPermissions();
    loadScannedCIs();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    console.log(type);
    if (type !=128) {
      alert('Try again');
      setScanned(true);
      return;
    }
    if (!scannedCIs.has(data)) {
      setScanned(true);
      const newCIs = new Set([...scannedCIs, data]);
      setScannedCIs(newCIs);
      // Save the updated CIs to AsyncStorage
      AsyncStorage.setItem('scannedCIs', JSON.stringify([...newCIs]));
    } else {
      alert('CI already scanned');
      setScanned(true);
    }
  };

  const exportCIs = () => {
    const ciArray = [...scannedCIs];
    const ciString = ciArray.join('\n');
    
    Share.share({
      message: ciString,
      title: 'Exported CIs',
    });
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MG Scanner</Text>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
        />
      </View>
      
      <View style={styles.listContainer}>
        <FlatList
          data={[...scannedCIs]}
          renderItem={({ item }) => (
            <Text style={styles.listItem}>{item}</Text>
          )}
          keyExtractor={(item) => item}
        />
      </View>
      
      {scanned && (
        <View style={styles.buttonContainer}>
          <Button title={'Tap to add another'} onPress={() => setScanned(false)} />
        </View>
      )}
      {scannedCIs && (
        <View style={styles.buttonContainer}>
          <Button title={'Reset Scanned '} onPress={() => setScannedCIs(new Set())} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title={'Export CIs'} onPress={exportCIs} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'lightgray',
    borderRadius: 10,
    overflow: 'hidden',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  listContainer: {
    flex: 1,
    borderStyle: 'solid',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    width: '100%',
  },
  listItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});
