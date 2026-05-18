import { resolveSectionComponent } from "@/lib/theme/engine/sectionRegistry";
import type { SectionRenderContext, ThemeSection } from "@/lib/theme/engine/types";

type DynamicSectionRendererProps = {
  sections: ThemeSection[];
  context: SectionRenderContext;
  className?: string;
};

export function DynamicSectionRenderer({ sections, context, className }: DynamicSectionRendererProps) {
  if (!sections.length) {
    return null;
  }

  return (
    <div className={className}>
      {sections.map((section, index) => {
        if (!section.type || section.disabled) {
          return null;
        }

        const SectionComponent = resolveSectionComponent(section.type);

        if (!SectionComponent) {
          return null;
        }

        return (
          <SectionComponent
            key={section.id ?? `${section.type}-${index}`}
            settings={section.settings ?? {}}
            context={context}
            index={index}
            section={section}
          />
        );
      })}
    </div>
  );
}
