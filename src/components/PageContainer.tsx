import { KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'

export default function PageContainer(props:any) {
  return (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{
        height: '100%',
        width: '100%',
    }}
  >
  </KeyboardAvoidingView>
  );
};