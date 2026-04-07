import re
from dataclasses import dataclass


@dataclass
class PIIResult:
    text: str
    detected: bool
    types: list[str]


EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
JP_PHONE_RE = re.compile(r'(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}|\+81[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})')
CREDIT_CARD_RE = re.compile(r'\b(?:\d[ \-]?){13,19}\b')
MY_NUMBER_RE = re.compile(r'\b\d{4}[ \-]?\d{4}[ \-]?\d{4}\b')


def _luhn_check(number: str) -> bool:
    digits = [int(d) for d in number if d.isdigit()]
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def screen(text: str) -> PIIResult:
    masked = text
    detected_types: list[str] = []

    if EMAIL_RE.search(masked):
        detected_types.append('EMAIL')
        masked = EMAIL_RE.sub('[PII_EMAIL]', masked)

    if JP_PHONE_RE.search(masked):
        detected_types.append('PHONE')
        masked = JP_PHONE_RE.sub('[PII_PHONE]', masked)

    for match in list(CREDIT_CARD_RE.finditer(masked)):
        digits_only = re.sub(r'[^\d]', '', match.group())
        if len(digits_only) >= 13 and _luhn_check(digits_only):
            if 'CREDIT_CARD' not in detected_types:
                detected_types.append('CREDIT_CARD')
            masked = masked.replace(match.group(), '[PII_CARD]')

    if MY_NUMBER_RE.search(masked):
        detected_types.append('MY_NUMBER')
        masked = MY_NUMBER_RE.sub('[PII_MYNUMBER]', masked)

    return PIIResult(text=masked, detected=len(detected_types) > 0, types=detected_types)
