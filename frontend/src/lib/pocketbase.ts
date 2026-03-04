import PocketBase from 'pocketbase';
import type { TypedPocketBase } from './pocketbase-types';

const pb = new PocketBase(import.meta.env.VITE_API_URL || 'http://localhost:8090') as TypedPocketBase;

export default pb;
