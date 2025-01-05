import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const usePreventExit = () => {
  const selectedProcedure = useSelector((state: RootState) => state.procedures.selectedProcedure);
  const isProcedureRunning = selectedProcedure?.status === 'running';

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcedureRunning) {
        // Cancel the event and show confirmation dialog
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
        return '';
      }
    };

    if (isProcedureRunning) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcedureRunning]);
}; 