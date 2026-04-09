import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { applyThemeMode, getStoredThemeMode, setStoredThemeMode, type ThemeMode } from "@/lib/theme";

const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const currentMode = getStoredThemeMode();
    setMode(currentMode);
    setResolvedTheme(applyThemeMode(currentMode));
  }, []);

  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(applyThemeMode("system"));

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [mode]);

  const updateMode = (nextMode: ThemeMode) => {
    setMode(nextMode);
    setStoredThemeMode(nextMode);
    setResolvedTheme(applyThemeMode(nextMode));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Change theme">
          {resolvedTheme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => updateMode(value as ThemeMode)}>
          <DropdownMenuRadioItem value="light" className="gap-2">
            <Sun className="w-4 h-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="gap-2">
            <Moon className="w-4 h-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="gap-2">
            <Monitor className="w-4 h-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
