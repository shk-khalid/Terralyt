class TravelParser:
    def parse(self, rows):
        """
        Preserves and returns the raw rows directly.
        Field mapping is handled in the schema normalization layer.
        """
        return rows

def parse_travel_csv(rows):
    return TravelParser().parse(rows)
