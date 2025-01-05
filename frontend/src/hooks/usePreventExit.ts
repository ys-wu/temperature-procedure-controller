import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { stopProcedure } from '../store/slices/procedureSlice';
import { useAppDispatch } from '../store/hooks';

export const usePreventExit = () => {
  const dispatch = useAppDispatch();
  const selectedProcedure = useSelector((state: RootState) => state.procedures.selectedProcedure);
  const isProcedureRunning = selectedProcedure?.status === 'running';

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcedureRunning) {
        // Show a confirmation dialog
        const message = 'A procedure is currently running. Are you sure you want to leave? The procedure will be stopped.';
        e.preventDefault();
        e.returnValue = message;

        // Attempt to stop the procedure
        dispatch(stopProcedure());

        return message;
      }
    };

    if (isProcedureRunning) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcedureRunning, dispatch]);
}; 