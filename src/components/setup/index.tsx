import { type FC, type FormEvent } from 'react';
import type { Intake, Plan } from '../../schemas';
import { CoreFields } from './CoreFields';
import { IntakeCard } from './IntakeCard';
import { OccasionPicker } from './OccasionPicker';
import { PrioritiesPicker } from './PrioritiesPicker';
import { EditingBanner, SetupHero } from './SetupHero';
import { useIntakeParser, useSetupForm } from './hooks';
import { buildIntake } from './helpers';

interface PlanSetupProps {
  plan?: Plan | null | undefined;
  onCreate?: (intake: Intake) => void;
  onUpdate?: (intake: Intake) => void;
  onLoadSample?: () => void;
  today: string;
}

/** Event vision & parameters: natural-language intake plus the structured plan form. */
export const PlanSetup: FC<PlanSetupProps> = ({
  plan,
  onCreate,
  onUpdate,
  onLoadSample,
  today,
}) => {
  const { values, setField, togglePriorityKey, applyParsed } = useSetupForm(plan);
  const parser = useIntakeParser(applyParsed);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const intake = buildIntake(values);
    if (plan && onUpdate) {
      onUpdate(intake);
    } else if (onCreate) {
      onCreate(intake);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {plan && <EditingBanner title={plan.title} />}
      <SetupHero plan={plan} onLoadSample={onLoadSample} />

      <IntakeCard
        description={parser.description}
        isParsing={parser.isParsing}
        parseError={parser.parseError}
        parseSuccess={parser.parseSuccess}
        onDescriptionChange={parser.setDescription}
        onParse={() => void parser.parse()}
        onDismissSuccess={parser.dismissSuccess}
      />

      <form onSubmit={handleSubmit} className="card space-y-6">
        <OccasionPicker value={values.occasion} onChange={(o) => setField('occasion', o)} />
        <CoreFields values={values} today={today} onChange={setField} />
        <PrioritiesPicker selectedKeys={values.priorityKeys} onToggle={togglePriorityKey} />

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button type="submit" className="btn-primary w-full sm:w-auto px-8 py-3 text-base">
            {plan ? 'Update Connected Celebration Parameters →' : 'Build Connected Plan →'}
          </button>
        </div>
      </form>
    </div>
  );
};
