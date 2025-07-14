// import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import MusicSheetClient from './musicsheet';
// Dynamically import the client component with SSR disabled
// const MusicSheetClient = dynamic(() => import('./musicsheet'), {
//   ssr: false,
// });

export default function MusicSheetPage() {
  return (
    <Suspense fallback={<div>Loading Music Sheet...</div>}>
      <MusicSheetClient />
    </Suspense>
  );
}



