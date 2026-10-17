import { useRef } from 'react';
import { PanResponder } from 'react-native';

interface UseEdgeSwipeDismissOptions {
  onDismiss: () => void;
  edgeThreshold?: number;
  distanceThreshold?: number;
  velocityThreshold?: number;
}

export function useEdgeSwipeDismiss({
  onDismiss,
  edgeThreshold = 40,
  distanceThreshold = 60,
  velocityThreshold = 0.35,
}: UseEdgeSwipeDismissOptions) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.x0 <= edgeThreshold &&
          gestureState.dx > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2
        );
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, gestureState) => {
        const isFromEdge = gestureState.x0 <= edgeThreshold + 15;
        const hasPassedDistance = gestureState.dx >= distanceThreshold;
        const hasPassedFlick = gestureState.dx >= 30 && gestureState.vx >= velocityThreshold;

        if (isFromEdge && (hasPassedDistance || hasPassedFlick)) {
          onDismiss();
        }
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  return panResponder;
}
