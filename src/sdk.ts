/**
 * Shared Vibexe SDK singleton
 * All hooks and utilities import from here — never instantiate VibexeApp elsewhere.
 */

import { VibexeApp } from '@vibexe/sdk';

const app = new VibexeApp({ appId: 'bldr_fcjZ7dIk2Ahq3xsZbHJhW' });

export default app;
