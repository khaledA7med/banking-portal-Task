# Shared

Reusable presentation and form helpers that are feature-agnostic.

```text
shared
  directives     DOM behavior such as focusing the first invalid submitted control
  pipes          Formatting helpers such as national ID masking
  ui             Reusable standalone presentational components, including the global loader
  validators     Shared reactive-form validators
```

Keep feature-specific business logic inside `features/*`; promote code here only when more than one feature can reasonably use it.
