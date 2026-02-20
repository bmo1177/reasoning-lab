import { ClinicalCase } from '@/types/case';
import { specialtyLabels, difficultyLabels } from '@/data/sampleCases';

interface PrintableCaseProps {
  clinicalCase: ClinicalCase;
}

export function PrintableCase({ clinicalCase }: PrintableCaseProps) {
  return (
    <div className="print-only hidden print:block p-8 text-black bg-white" id="printable-case">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">{clinicalCase.title}</h1>
        <div className="flex gap-4 mt-2 text-sm">
          <span>Specialty: {specialtyLabels[clinicalCase.specialty]}</span>
          <span>Difficulty: {difficultyLabels[clinicalCase.difficulty]}</span>
          <span>Est. Time: {clinicalCase.estimatedMinutes} min</span>
        </div>
      </div>

      {/* Patient Info */}
      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Patient Information</h2>
        <p><strong>Age/Sex:</strong> {clinicalCase.patient.age}yo {clinicalCase.patient.sex}</p>
        <p><strong>Chief Complaint:</strong> {clinicalCase.patient.chiefComplaint}</p>
      </section>

      {/* Presentation */}
      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Presentation</h2>
        <p className="text-sm leading-relaxed">{clinicalCase.presentation}</p>
      </section>

      {/* History */}
      {clinicalCase.history && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">History</h2>
          <p className="text-sm leading-relaxed">{clinicalCase.history}</p>
        </section>
      )}

      {/* Vital Signs */}
      {clinicalCase.vitalSigns && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Vital Signs</h2>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <p>BP: {clinicalCase.vitalSigns.bloodPressure}</p>
            <p>HR: {clinicalCase.vitalSigns.heartRate} bpm</p>
            <p>RR: {clinicalCase.vitalSigns.respiratoryRate}/min</p>
            <p>Temp: {clinicalCase.vitalSigns.temperature}°C</p>
            <p>SpO2: {clinicalCase.vitalSigns.oxygenSaturation}%</p>
          </div>
        </section>
      )}

      {/* Physical Exam */}
      {clinicalCase.physicalExam && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Physical Examination</h2>
          <p className="text-sm leading-relaxed">{clinicalCase.physicalExam}</p>
        </section>
      )}

      {/* Available Tests */}
      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Available Diagnostic Tests</h2>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {clinicalCase.availableTests.map(test => (
            <div key={test.id} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-gray-400" />
              <span>{test.name} ({test.category})</span>
            </div>
          ))}
        </div>
      </section>

      {/* Reasoning Canvas Area */}
      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Reasoning Map</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-[300px] flex items-center justify-center">
          <p className="text-gray-400 text-sm">Draw your reasoning map here</p>
        </div>
      </section>

      {/* Differential Diagnosis */}
      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Differential Diagnosis</h2>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="flex items-center gap-3 mb-2 text-sm">
            <span className="font-medium w-4">{n}.</span>
            <div className="flex-1 border-b border-gray-300 pb-1" />
            <span className="text-xs text-gray-500 w-24">Confidence: ____%</span>
          </div>
        ))}
      </section>

      {/* Reflection */}
      <section>
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">Reflection</h2>
        <div className="border border-gray-300 rounded h-32" />
      </section>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
        Think Studio — Clinical Reasoning Platform • Date: ___/___/______
      </div>
    </div>
  );
}

export function handlePrintCase() {
  window.print();
}
