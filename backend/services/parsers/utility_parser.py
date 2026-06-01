class UtilityParser:
    def parse(self, rows):
        """
        Preserves and returns the raw rows directly.
        Field mapping is handled in the schema normalization layer.
        """
        return rows

def parse_utility_csv(rows):
    return UtilityParser().parse(rows)
