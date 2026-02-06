import React from 'react';

const JornadaLoadingSkeleton = () => (
  <div className="animate-pulse flex flex-col gap-8">
    <div className="h-40 bg-gray-100 rounded-2xl border border-gray-200"></div>
    <div className="h-32 bg-gray-100 rounded-2xl border border-gray-200"></div>
    <div className="h-64 bg-gray-100 rounded-2xl border border-gray-200"></div>
  </div>
);

export default JornadaLoadingSkeleton;
