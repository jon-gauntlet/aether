import { useState, useEffect } from 'react';
import { Observable } from 'rxjs';

export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(
      (newValue) => setValue(newValue),
      (error) => console.error('Observable error:', error)
    );

    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}