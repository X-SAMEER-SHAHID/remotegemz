import React, { useState } from 'react';
import { WorkEntryForm } from '../components/WorkEntryForm';
import { WorkEntryList } from '../components/WorkEntryList';
import { format } from 'date-fns';

export function TrackWork() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <WorkEntryForm onDateChange={setSelectedDate} />
      </div>
      <div>
        <WorkEntryList selectedDate={selectedDate} />
      </div>
    </div>
  );
}