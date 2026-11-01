import { useCallback, useState } from 'react';
import type { Intake, Plan } from '../../schemas';
import { api } from '../../lib/api';
import {
  DEFAULT_BUDGET,
  DEFAULT_CITY,
  DEFAULT_GUESTS,
  DEFAULT_OCCASION,
  DEFAULT_PRIORITY_KEYS,
  DEFAULT_VIBE,
} from './constants';
import {
  defaultEventDate,
  parseSuccessMessage,
  priorityKeysFromCategories,
  type SetupFormValues,
} from './helpers';

const PARSE_ERROR_MESSAGE =
  'Could not parse text automatically. You can fill the form fields below manually.';

/** Form values used for a brand-new plan. */
function defaultFormValues(): SetupFormValues {
  return {
    occasion: DEFAULT_OCCASION,
    budgetString: DEFAULT_BUDGET,
    guests: DEFAULT_GUESTS,
    eventDate: defaultEventDate(),
    vibe: DEFAULT_VIBE,
    city: DEFAULT_CITY,
    priorityKeys: [...DEFAULT_PRIORITY_KEYS],
  };
}

/** Initial form values, seeded from the existing plan when editing. */
function initialFormValues(plan?: Plan | null): SetupFormValues {
  const defaults = defaultFormValues();
  if (!plan) return defaults;
  return {
    occasion: plan.occasion,
    budgetString: String(plan.totalBudget),
    guests: plan.guests,
    eventDate: plan.eventDate || defaults.eventDate,
    vibe: plan.vibe ?? defaults.vibe,
    city: plan.city ?? defaults.city,
    priorityKeys: plan.priorityKeys?.length ? plan.priorityKeys : defaults.priorityKeys,
  };
}

/** Merge a parsed intake into form values, keeping existing values for unrecognised fields. */
function mergeParsedIntake(prev: SetupFormValues, result: Intake): SetupFormValues {
  const matchingKeys = priorityKeysFromCategories(result.priorities);
  return {
    ...prev,
    occasion: result.occasion,
    budgetString: String(result.totalBudget),
    guests: result.guests,
    eventDate: result.eventDate || prev.eventDate,
    vibe: result.vibe || prev.vibe,
    city: result.city || prev.city,
    priorityKeys: matchingKeys.length > 0 ? matchingKeys : prev.priorityKeys,
  };
}

/** Structured form state, seeded from the existing plan when editing. */
export function useSetupForm(plan?: Plan | null) {
  const [values, setValues] = useState<SetupFormValues>(() => initialFormValues(plan));

  const setField = useCallback(
    <K extends keyof SetupFormValues>(key: K, value: SetupFormValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const togglePriorityKey = useCallback(
    (id: string) =>
      setValues((prev) => ({
        ...prev,
        priorityKeys: prev.priorityKeys.includes(id)
          ? prev.priorityKeys.filter((k) => k !== id)
          : [...prev.priorityKeys, id],
      })),
    [],
  );

  /** Merge an AI-parsed intake into the form (only fields that were recognised). */
  const applyParsed = useCallback((result: Intake) => {
    setValues((prev) => mergeParsedIntake(prev, result));
  }, []);

  return { values, setField, togglePriorityKey, applyParsed };
}

/** Natural-language intake: description text, Gemini parse call and its status messages. */
export function useIntakeParser(onParsed: (result: Intake) => void) {
  const [description, setDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  const parse = useCallback(async () => {
    if (!description.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setParseSuccess(null);
    try {
      const result = await api.parseIntake(description);
      onParsed(result);
      setParseSuccess(parseSuccessMessage(result));
    } catch {
      setParseError(PARSE_ERROR_MESSAGE);
    } finally {
      setIsParsing(false);
    }
  }, [description, onParsed]);

  const dismissSuccess = useCallback(() => setParseSuccess(null), []);

  return {
    description,
    setDescription,
    isParsing,
    parseError,
    parseSuccess,
    parse,
    dismissSuccess,
  };
}
