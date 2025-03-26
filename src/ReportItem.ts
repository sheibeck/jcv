export class ReportItem {
  Number: string = '';
  ReleaseDateTime: Date | null = null;
  Sprint: string = '';

  constructor(number: string, releaseDateTime: Date | null, firstPiStartDate: Date) {
    this.Number = number;
    this.ReleaseDateTime = releaseDateTime;
    this.Sprint = calculatePi(firstPiStartDate, this.ReleaseDateTime);
  }
}

const calculatePi = (firstPiStartDate: Date, releaseDateTime: Date | null) => {
  if (
    !releaseDateTime
    || releaseDateTime < firstPiStartDate 
    || releaseDateTime.getUTCFullYear() != firstPiStartDate.getUTCFullYear()
  ) {
    return "-";
  }

  const piLengthInWeeks = 7; // 7 weeks: 3 sprints (2 week each) + 1 cooldown (1 week)
  const year = firstPiStartDate.getUTCFullYear();
  
  const diff = Math.abs(releaseDateTime.getTime() - firstPiStartDate.getTime());
  const diffWeeks = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)); // 1000ms * 60s * 60m * 24h * 7d
  
  const currentPi = Math.ceil(diffWeeks / piLengthInWeeks);
  const currentSprint = Math.ceil((diffWeeks % piLengthInWeeks) / 2);
  
  return `${year}.${currentPi}.${currentSprint == 0 ? "Cooldown" : currentSprint}`;
};