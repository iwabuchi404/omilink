import PocketBase from 'pocketbase';
import type { TypedPocketBase } from './pocketbase-types';

const pb = new PocketBase(window.location.origin) as TypedPocketBase;

export default pb;
