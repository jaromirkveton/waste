interface BinIconProps {
  trashTypeId: number;
  color: string;
}

export function BinIcon({ trashTypeId, color }: BinIconProps) {
  switch (trashTypeId) {
    case 5:
      return (
        <svg className="size-3" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M6.5 5.5C6.5 5.05 6.85 4.7 7.3 4.7H10.5V7.1C10.5 7.45 10.75 7.7 11.1 7.7H13.5V14.5C13.5 14.95 13.15 15.3 12.7 15.3H7.3C6.85 15.3 6.5 14.95 6.5 14.5V5.5ZM13.5 7.7H11.1V5.3L13.5 7.7Z"
            fill={color}
          />
        </svg>
      );
    case 9:
      return (
        <svg className="size-3" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4 6H16L15.2 8.5H4.8L4 6ZM5.2 10H14.8L14 12.5H6L5.2 10ZM6.4 14H13.6L12.8 16H7.2L6.4 14Z"
            fill={color}
          />
          <path d="M10 3.5L11.2 6H8.8L10 3.5Z" fill={color} />
        </svg>
      );
    case 3:
      return (
        <svg className="size-3" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M7 5.5H13C13.55 5.5 14 5.95 14 6.5V14C14 14.55 13.55 15 13 15H7C6.45 15 6 14.55 6 14V6.5C6 5.95 6.45 5.5 7 5.5ZM8 7.5V12.5H12V7.5H8Z"
            fill={color}
          />
          <path d="M8.5 4.5H11.5V5.5H8.5V4.5Z" fill={color} />
        </svg>
      );
    case 1:
      return (
        <svg className="size-3" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M8.5 4.5C8.5 4.17 8.77 3.9 9.1 3.9H10.1C10.43 3.9 10.7 4.17 10.7 4.5V5.5H11.5C11.83 5.5 12.1 5.77 12.1 6.1V15.1C12.1 15.43 11.83 15.7 11.5 15.7H7.7C7.37 15.7 7.1 15.43 7.1 15.1V6.1C7.1 5.77 7.37 5.5 7.7 5.5H8.5V4.5ZM8.5 6.5V14.5H10.7V6.5H8.5Z"
            fill={color}
          />
          <rect x="8.8" y="7.5" width="1.2" height="4.5" rx="0.4" fill={color} />
          <rect x="10" y="7.5" width="1.2" height="4.5" rx="0.4" fill={color} />
        </svg>
      );
    default:
      return (
        <svg className="size-3" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M6 6.5H14V13.5C14 14.05 13.55 14.5 13 14.5H7C6.45 14.5 6 14.05 6 13.5V6.5Z"
            fill={color}
          />
        </svg>
      );
  }
}
