const FIVE_MINUTES_IN_MS = 1000 * 60 * 5;

export const DateUtils: {
  clockOffset: number;
  getDateWithClockOffset(): Date;
  getClockOffset(): number;
  getHeaderStringFromDate(date?: Date): string;
  getDateFromHeaderString(header: string): Date;
  isClockSkewed(serverDate: Date): boolean;
  isClockSkewError(error: any): boolean;
  setClockOffset(offset: number): void;
} = Object.freeze({
  /**
   * Milliseconds to offset the date to compensate for clock skew between device & services
   */
  clockOffset: 0,

  getDateWithClockOffset(): Date {
    if (DateUtils.clockOffset) {
      return new Date(new Date().getTime() + DateUtils.clockOffset);
    } else {
      return new Date();
    }
  },

  /**
   * @returns {number} Clock offset in milliseconds
   */
  getClockOffset(): number {
    return DateUtils.clockOffset;
  },

  getHeaderStringFromDate(
    date: Date = DateUtils.getDateWithClockOffset()
  ): string {
    return date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  },

  getDateFromHeaderString(header: string): Date {
    const [, year, month, day, hour, minute, second] =
      header.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).+/) || [];

    return new Date(
      Date.UTC(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day),
        Number.parseInt(hour),
        Number.parseInt(minute),
        Number.parseInt(second)
      )
    );
  },

  isClockSkewed(serverDate: Date): boolean {
    // API gateway permits client calls that are off by no more than ±5 minutes
    return (
      Math.abs(
        serverDate.getTime() - DateUtils.getDateWithClockOffset().getTime()
      ) >= FIVE_MINUTES_IN_MS
    );
  },

  isClockSkewError(error: any): boolean {
    if (!error?.response?.headers) {
      return false;
    }

    const { headers } = error.response;

    return Boolean(
      ['BadRequestException', 'InvalidSignatureException'].includes(
        headers['x-amzn-errortype']
      ) &&
        (headers.date || headers.Date)
    );
  },

  /**
   * @param {number} offset Clock offset in milliseconds
   */
  setClockOffset(offset: number): void {
    DateUtils.clockOffset = offset;
  },
});
