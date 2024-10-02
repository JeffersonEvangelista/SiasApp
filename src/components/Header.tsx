import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,StatusBar  } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#ff8c00" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 30 }}>
      <Icon name="cog" style={{ marginTop: '-35%' }} size={42} color="#fff" />
      <Text style={styles.configText}>Configurações</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 16,
    paddingVertical: 110,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    alignItems: 'center',
    marginBottom: 40,
    height: '44%',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  configText: {
    fontSize: 30,
    color: '#fff',
    marginLeft: 20,
    marginTop: '-35%'
  },
});

export default Header;
