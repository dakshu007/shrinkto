import { forwardRef } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | AnchorProps
>(function Button(
  { variant = "primary", size = "md", fullWidth, className, ...props },
  ref,
) {
  const cls = cx(
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth && styles.full,
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as AnchorProps;
    const isExternal = /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
          {...rest}
        />
      );
    }
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={cls} {...rest} />
    );
  }

  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} className={cls} {...(props as ButtonProps)} />
  );
});
