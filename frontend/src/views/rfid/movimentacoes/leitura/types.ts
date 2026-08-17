export interface LeituraHandler {
  handleProcess?: () => void;
  processLabel?: string;
  processLabelSubmitting?: string;
  processTooltip?: string;
  hasData: boolean;
  isSubmitting: boolean;
  isReading?: boolean;
  isChoiceScreen?: boolean;
}
