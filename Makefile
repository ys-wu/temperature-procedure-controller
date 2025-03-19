.PHONY: testing-operation-doc

testing-operation-doc:
	pandoc testing_operation.md -o testing_operation.pdf
