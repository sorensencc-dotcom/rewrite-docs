export interface SecurityPolicy {
  rules: any[];
}

export class WaylandSecurityPolicy implements SecurityPolicy {
  rules: any[] = [];

  addRule(rule: any): void {
    this.rules.push(rule);
  }

  validate(action: any): boolean {
    return true;
  }
}
