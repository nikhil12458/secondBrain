import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToSettings } from '../services/db';

export function useFeatures() {
  const { userDetails } = useAuth();
  const [globalFeatures, setGlobalFeatures] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      setGlobalFeatures(settings.features || {});
    });
    return () => unsubscribe();
  }, []);

  const isFeatureEnabled = (featureName) => {
    // If user explicitly has it disabled, return false
    if (userDetails?.disabledFeatures?.includes(featureName)) {
      return false;
    }
    
    // Otherwise, check global settings (default to true if not set)
    return globalFeatures[featureName] !== false;
  };

  return {
    isFeatureEnabled,
    globalFeatures
  };
}
