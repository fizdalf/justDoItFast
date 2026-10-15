import {useEffect, useState} from 'react';
import type {WordPack} from '../../core/types.js';

/** Catálogo público de mazos de palabras. */
export function usePacks(): WordPack[] {
  const [packs, setPacks] = useState<WordPack[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/packs')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.data) setPacks(data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return packs;
}
