import { useEffect, useRef, useState } from 'react';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Dialog,
  FileUpload,
  Grid,
  Progress,
  Radio,
  SegmentedControl,
  Select,
  Spinner,
  Stack,
  Text,
  TextField,
  Textarea,
  Title,
  Toggle,
  Tooltip,
  today,
  useToast,
  type LocalDate,
} from 'more-or-less-ui';
import styles from '../site.module.css';
import { ClassCard } from './ClassCard';
import { CLASSES, formatDay, isNotThursday } from './data';

const TIMES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

const EXTRAS = [
  { value: 'apron', label: 'Apron', description: 'We lend one, or keep it for 12.' },
  { value: 'firing', label: 'Extra firing', description: 'A second trip through the kiln.' },
  { value: 'tools', label: 'Tool kit', description: 'Yours to take home.' },
];

const PAYMENT = [
  { value: 'once', label: 'All at once' },
  { value: 'monthly', label: 'Monthly' },
];

const validateName = (value: string) => (value.trim() ? undefined : 'Enter your name');

/** The booking form, with the class beside it. A real flow: validate, confirm, save, say it worked. */
export function BookClass() {
  const toast = useToast();
  const [isBannerShown, setIsBannerShown] = useState(true);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [startDate, setStartDate] = useState<LocalDate | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Two things the booking needs: the progress bar is how far along the form is
  const detailsDone = (name.trim() ? 1 : 0) + (startDate ? 1 : 0);

  const review = () => {
    const error = validateName(name);
    setNameError(error);
    if (!error) setIsConfirming(true);
  };

  const confirm = () => {
    setIsSaving(true);
    timer.current = window.setTimeout(() => {
      setIsSaving(false);
      setIsConfirming(false);
      toast.add({
        title: 'You’re booked',
        description: startDate
          ? `Wheel throwing starts ${formatDay(startDate)}. See you there${name.trim() && `, ${name.trim()}`}.`
          : `Wheel throwing. See you there${name.trim() && `, ${name.trim()}`}.`,
      });
    }, 1000);
  };

  return (
    <Stack gap="more">
      {isBannerShown && (
        <Banner title="Autumn term is open" onDismiss={() => setIsBannerShown(false)}>
          Four places left on Thursday evenings.
        </Banner>
      )}

      <div className={styles.pair}>
        <Card padding="more">
          <Stack gap="more">
            <Title as="h3">Book your place</Title>

            <Stack gap="less">
              <Progress
                value={detailsDone}
                max={2}
                aria-label="Booking details"
                aria-valuetext={`${detailsDone} of 2 details filled in`}
              />
              <Text size="less" color="less">
                {detailsDone} of 2 details filled in: your name and a start date
              </Text>
            </Stack>

            <TextField
              label="Your name"
              tooltip="As it should appear on the class list."
              isRequired
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError(validateName(event.target.value));
              }}
              onBlur={() => setNameError(validateName(name))}
              error={nameError}
            />

            <Grid columns={{ minWidth: '12rem' }} gap="normal">
              <Select label="Class" options={CLASSES} defaultValue="wheel" />
              <DatePicker
                label="Start date"
                tooltip="Classes run on Thursdays."
                value={startDate}
                onChange={setStartDate}
                min={today()}
                isDateDisabled={isNotThursday}
              />
            </Grid>

            <Radio label="Time" options={TIMES} orientation="horizontal" defaultValue="evening" />
            <Checkbox label="Add-ons" options={EXTRAS} defaultValue={['apron']} />
            <Grid columns={{ minWidth: '12rem' }} gap="normal">
              <TextField
                label="People in your group"
                type="number"
                hasSteppers
                min={1}
                max={6}
                defaultValue={2}
              />
              <SegmentedControl label="Pay" options={PAYMENT} defaultValue="once" />
            </Grid>
            <Textarea
              label="Anything we should know?"
              placeholder="Allergies, access, a first time at the wheel…"
            />
            <FileUpload label="A piece you have made (optional)" accept="image/*" />
            <Toggle label="Remind me the day before" defaultChecked />

            <Stack direction="row" gap="normal" align="center" wrap>
              <Tooltip content="You pay nothing yet.">
                <Button background="more" onClick={review}>
                  Book my place
                </Button>
              </Tooltip>
              <Button background="less" onClick={() => setIsConfirming(true)}>
                See the confirmation
              </Button>
            </Stack>

            <Dialog
              title="Book Wheel throwing?"
              isOpen={isConfirming}
              onOpenChange={(isOpen) => {
                if (!isSaving) setIsConfirming(isOpen);
              }}
              actions={
                <>
                  <Button
                    background="less"
                    isDisabled={isSaving}
                    onClick={() => setIsConfirming(false)}
                  >
                    Not yet
                  </Button>
                  <Button background="more" isLoading={isSaving} onClick={confirm}>
                    Yes, book it
                  </Button>
                </>
              }
            >
              <Stack gap="normal">
                <Text as="p">
                  {startDate ? `Starting ${formatDay(startDate)}. ` : ''}We will save you a place
                  and email you the details.
                </Text>
                {isSaving && (
                  <Stack direction="row" gap="normal" align="center">
                    <Spinner aria-label="Saving your booking" />
                    <Text color="less">Saving…</Text>
                  </Stack>
                )}
              </Stack>
            </Dialog>
          </Stack>
        </Card>

        <ClassCard startDate={startDate} onStartDateChange={setStartDate} />
      </div>
    </Stack>
  );
}
