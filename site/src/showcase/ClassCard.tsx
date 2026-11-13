import {
  Avatar,
  Button,
  Calendar,
  Card,
  Chip,
  Collapsible,
  Divider,
  Drawer,
  Progress,
  Stack,
  Text,
  Title,
  today,
  type LocalDate,
} from 'more-or-less-ui';
import { isNotThursday } from './data';

/**
 * What the class is, beside the form. The calendar in the drawer and the form's date field are two views
 * of one value, so choosing a day in either fills the other.
 */
export function ClassCard({
  startDate,
  onStartDateChange,
}: {
  startDate: LocalDate | null;
  onStartDateChange: (date: LocalDate) => void;
}) {
  return (
    <Card padding="more">
      <Stack gap="more">
        <Stack gap="less">
          <Title as="h3">Wheel throwing</Title>
          <Text as="p" color="less">
            Four Thursday evenings at the wheel. You will leave with three pieces you made.
          </Text>
        </Stack>

        <Avatar isTextShown name="Jonas Pike" description="Your teacher" />

        <Stack direction="row" gap="less" wrap>
          <Chip>4 weeks</Chip>
          <Chip>Clay included</Chip>
          <Chip>All levels</Chip>
        </Stack>

        <Progress value={7} max={10} aria-label="Places taken: 7 of 10" />
        <Text size="less" color="less">
          7 of 10 places taken
        </Text>

        <Drawer title="Term dates" trigger={<Button background="less">See the term dates</Button>}>
          <Calendar
            aria-label="Term dates"
            value={startDate}
            onChange={onStartDateChange}
            min={today()}
            isDateDisabled={isNotThursday}
          />
        </Drawer>

        <Divider />

        <Stack gap="normal">
          <Collapsible title="What should I wear?">
            <Text as="p">Something that can get clay on it. We lend aprons.</Text>
          </Collapsible>
          <Collapsible title="Can I miss a week?">
            <Text as="p">
              Yes. Come to another group that week, or take the video and catch up.
            </Text>
          </Collapsible>
        </Stack>
      </Stack>
    </Card>
  );
}
